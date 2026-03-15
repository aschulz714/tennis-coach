'use client';

import { TennisSession } from '@/lib/types';
import { deleteSession } from '@/lib/storage';

interface Props {
  sessions: TennisSession[];
  onDelete: () => void;
}

export default function SessionList({ sessions, onDelete }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="text-center text-neutral-500 py-12">
        <p className="text-lg">No sessions yet</p>
        <p className="text-sm mt-1">Log your first practice or match!</p>
      </div>
    );
  }

  function handleDelete(id: string) {
    if (confirm('Delete this session?')) {
      deleteSession(id);
      onDelete();
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatScore(session: TennisSession): string {
    if (session.sets && session.sets.length > 0) {
      const nonEmpty = session.sets.filter((s) => s.yours > 0 || s.opponent > 0);
      return nonEmpty
        .map((s, i) => {
          // Third set is a match tiebreak — display in brackets
          if (i === 2 || (nonEmpty.length === 3 && i === nonEmpty.length - 1)) {
            return `[${s.yours}-${s.opponent}]`;
          }
          return `${s.yours}-${s.opponent}`;
        })
        .join(', ');
    }
    return session.score || '';
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="bg-neutral-800 border border-neutral-700 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  session.type === 'match'
                    ? session.result === 'win'
                      ? 'bg-green-900 text-green-300'
                      : 'bg-red-900 text-red-300'
                    : 'bg-blue-900 text-blue-300'
                }`}
              >
                {session.type === 'match'
                  ? session.result === 'win'
                    ? 'W'
                    : 'L'
                  : 'Practice'}
              </span>
              <span className="text-sm text-neutral-300">
                {formatDate(session.date)}
              </span>
              <span className="text-xs text-neutral-500">
                {session.durationMinutes}min
              </span>
            </div>
            <button
              onClick={() => handleDelete(session.id)}
              className="text-neutral-600 hover:text-red-400 text-xs"
            >
              Delete
            </button>
          </div>

          {session.type === 'match' && (
            <>
              <div className="text-sm mb-1">
                {session.opponent && (
                  <span className="text-neutral-300">
                    vs {session.opponent}{' '}
                  </span>
                )}
                {formatScore(session) && (
                  <span className="text-neutral-400">{formatScore(session)}</span>
                )}
              </div>
              {/* Match metadata */}
              <div className="flex flex-wrap gap-1.5 mb-1">
                {session.team && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs ${
                      session.team === '4.0 Verma'
                        ? 'bg-blue-900/50 text-blue-400'
                        : session.team === '4.5 Dhindsa'
                        ? 'bg-purple-900/50 text-purple-400'
                        : 'bg-neutral-700 text-neutral-400'
                    }`}
                  >
                    {session.team}
                  </span>
                )}
                {session.matchFormat && (
                  <span className="px-1.5 py-0.5 bg-neutral-700 rounded text-xs text-neutral-400">
                    {session.matchFormat}
                  </span>
                )}
                {session.surface && (
                  <span className="px-1.5 py-0.5 bg-neutral-700 rounded text-xs text-neutral-400">
                    {session.surface}
                  </span>
                )}
                {session.doublesPartner && (
                  <span className="px-1.5 py-0.5 bg-neutral-700 rounded text-xs text-neutral-400">
                    w/ {session.doublesPartner}
                  </span>
                )}
              </div>
            </>
          )}

          {session.drills && session.drills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {session.drills.map((drill) => (
                <span
                  key={drill}
                  className="px-2 py-0.5 bg-neutral-700 rounded text-xs text-neutral-400"
                >
                  {drill}
                </span>
              ))}
            </div>
          )}

          {session.notes && (
            <p className="text-xs text-neutral-500 mt-1">{session.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}
