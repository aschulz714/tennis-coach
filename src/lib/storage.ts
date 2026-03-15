import { TennisSession } from './types';

const SESSIONS_KEY = 'tennis-coach-sessions';
const UTR_PLAYER_ID_KEY = 'tennis-coach-utr-id';
const UTR_LAST_SYNC_KEY = 'tennis-coach-utr-last-sync';

export function getSessions(): TennisSession[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(SESSIONS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as TennisSession[];
}

export function saveSession(session: TennisSession): void {
  const sessions = getSessions();
  sessions.unshift(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getSession(id: string): TennisSession | undefined {
  return getSessions().find((s) => s.id === id);
}

// ─── UTR Storage ────────────────────────────────────────────

export function getUtrPlayerId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(UTR_PLAYER_ID_KEY);
}

export function setUtrPlayerId(id: string): void {
  localStorage.setItem(UTR_PLAYER_ID_KEY, id);
}

export function clearUtrPlayerId(): void {
  localStorage.removeItem(UTR_PLAYER_ID_KEY);
  localStorage.removeItem(UTR_LAST_SYNC_KEY);
}

export function getLastSync(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(UTR_LAST_SYNC_KEY);
}

export function setLastSync(date: string): void {
  localStorage.setItem(UTR_LAST_SYNC_KEY, date);
}

/**
 * Merge UTR-synced sessions into storage, skipping duplicates by utrMatchId.
 * Returns the number of new sessions added.
 */
export function mergeUtrSessions(newSessions: TennisSession[]): number {
  const existing = getSessions();
  const existingUtrIds = new Set(
    existing.filter((s) => s.utrMatchId).map((s) => s.utrMatchId)
  );

  const toAdd = newSessions.filter(
    (s) => s.utrMatchId && !existingUtrIds.has(s.utrMatchId)
  );

  if (toAdd.length === 0) return 0;

  // Merge and sort by date descending
  const merged = [...existing, ...toAdd].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(merged));
  return toAdd.length;
}
