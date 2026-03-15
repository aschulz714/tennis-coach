'use client';

import { useState, useEffect, useCallback } from 'react';
import { TennisSession } from '@/lib/types';
import { getSessions } from '@/lib/storage';
import SessionForm from '@/components/SessionForm';
import SessionList from '@/components/SessionList';
import CoachChat from '@/components/CoachChat';
import Schedule from '@/components/Schedule';
import StatsView from '@/components/StatsView';
import Settings from '@/components/Settings';

type Tab = 'log' | 'history' | 'coach' | 'schedule' | 'settings';

export default function Home() {
  const [tab, setTab] = useState<Tab>('log');
  const [sessions, setSessions] = useState<TennisSession[]>([]);
  const [showStats, setShowStats] = useState(false);

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
    <div className="flex flex-col h-dvh max-w-lg mx-auto" style={{ paddingTop: 'var(--sat)', paddingLeft: 'var(--sal)', paddingRight: 'var(--sar)' }}>
      {/* Header */}
      <header className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-400">Tennis Coach</h1>
          <button
            onClick={() => setTab('settings')}
            className={`p-1.5 rounded-lg transition ${
              tab === 'settings'
                ? 'text-green-400 bg-neutral-800'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
            aria-label="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 0 1 1.262.125l.962.962a1 1 0 0 1 .125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.295a1 1 0 0 1 .804.98v1.361a1 1 0 0 1-.804.98l-1.473.295a6.95 6.95 0 0 1-.587 1.416l.834 1.25a1 1 0 0 1-.125 1.262l-.962.962a1 1 0 0 1-1.262.125l-1.25-.834a6.953 6.953 0 0 1-1.416.587l-.295 1.473a1 1 0 0 1-.98.804H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.957 6.957 0 0 1-1.416-.587l-1.25.834a1 1 0 0 1-1.262-.125l-.962-.962a1 1 0 0 1-.125-1.262l.834-1.25a6.957 6.957 0 0 1-.587-1.416l-1.473-.295A1 1 0 0 1 1 11.18V9.82a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 0 1 .125-1.262l.962-.962A1 1 0 0 1 5.38 3.53l1.25.834a6.957 6.957 0 0 1 1.416-.587l.295-1.473ZM13 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        {sessions.length > 0 && (
          <div className="flex gap-3 mt-1.5 text-xs text-neutral-400 flex-wrap">
            <span>{stats.thisWeek} this week</span>
            <span>{stats.total} total</span>
            {stats.matches > 0 && (
              <span>
                {stats.wins}W-{stats.matches - stats.wins}L
              </span>
            )}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
        {tab === 'log' && (
          <SessionForm
            onSaved={() => {
              refresh();
              setTab('history');
            }}
          />
        )}
        {tab === 'history' && (
          <>
            {/* List / Stats toggle */}
            <div className="flex rounded-lg overflow-hidden border border-neutral-700 mb-3">
              <button
                type="button"
                onClick={() => setShowStats(false)}
                className={`flex-1 py-1.5 text-xs font-medium transition ${
                  !showStats
                    ? 'bg-green-600 text-white'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                History
              </button>
              <button
                type="button"
                onClick={() => setShowStats(true)}
                className={`flex-1 py-1.5 text-xs font-medium transition ${
                  showStats
                    ? 'bg-green-600 text-white'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                Stats
              </button>
            </div>
            {showStats ? (
              <StatsView sessions={sessions} />
            ) : (
              <SessionList sessions={sessions} onDelete={refresh} />
            )}
          </>
        )}
        {tab === 'coach' && <CoachChat />}
        {tab === 'schedule' && <Schedule />}
        {tab === 'settings' && (
          <Settings
            onClose={() => setTab('log')}
            onSessionsImported={refresh}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="shrink-0 border-t border-neutral-800 bg-neutral-950" style={{ paddingBottom: 'var(--sab)' }}>
        <div className="flex">
          {([
            { key: 'log' as Tab, label: 'Log', icon: '+' },
            { key: 'history' as Tab, label: 'History', icon: '\u2630' },
            { key: 'schedule' as Tab, label: 'Schedule', icon: '\uD83D\uDCC5' },
            { key: 'coach' as Tab, label: 'Coach', icon: '\uD83D\uDCAC' },
          ]).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 text-center transition ${
                tab === key
                  ? 'text-green-400 border-t-2 border-green-400'
                  : 'text-neutral-500'
              }`}
            >
              <div className="text-base leading-tight">{icon}</div>
              <div className="text-[10px] mt-0.5">{label}</div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
