import { TennisSession } from './types';

const SESSIONS_KEY = 'tennis-coach-sessions';

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
