'use client';

import { useState, useEffect, useCallback } from 'react';
import { TennisSession } from '@/lib/types';
import { getSessions } from '@/lib/storage';
import SessionForm from '@/components/SessionForm';
import SessionList from '@/components/SessionList';
import CoachChat from '@/components/CoachChat';

type Tab = 'log' | 'history' | 'coach';

export default function Home() {
  const [tab, setTab] = useState<Tab>('log');
  const [sessions, setSessions] = useState<TennisSession[]>([]);

  const refresh = useCallback(() => {
    setSessions(getSessions());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = {
    total: sessions.length,
    matches: sessions.filter((s) => s.type === 'match').length,
    wins: sessions.filter((s) => s.result === 'win').length,
    thisWeek: sessions.filter((s) => {
      const d = new Date(s.date);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo;
    }).length,
  };

  return (
    <div className="flex flex-col h-dvh max-w-lg mx-auto">
      {/* Header */}
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-green-400">Tennis Coach</h1>
        {sessions.length > 0 && (
          <div className="flex gap-4 mt-2 text-xs text-neutral-400">
            <span>{stats.thisWeek} this week</span>
            <span>{stats.total} total sessions</span>
            {stats.matches > 0 && (
              <span>
                {stats.wins}W-{stats.matches - stats.wins}L
              </span>
            )}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-2">
        {tab === 'log' && (
          <SessionForm
            onSaved={() => {
              refresh();
              setTab('history');
            }}
          />
        )}
        {tab === 'history' && (
          <SessionList sessions={sessions} onDelete={refresh} />
        )}
        {tab === 'coach' && <CoachChat />}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex border-t border-neutral-800 bg-neutral-950">
        {([
          { key: 'log' as Tab, label: 'Log', icon: '+' },
          { key: 'history' as Tab, label: 'History', icon: '\u2630' },
          { key: 'coach' as Tab, label: 'Coach', icon: '\uD83D\uDCAC' },
        ]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-center transition ${
              tab === key
                ? 'text-green-400 border-t-2 border-green-400'
                : 'text-neutral-500'
            }`}
          >
            <div className="text-lg">{icon}</div>
            <div className="text-xs">{label}</div>
          </button>
        ))}
      </nav>
    </div>
  );
}
