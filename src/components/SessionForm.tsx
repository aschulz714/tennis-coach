'use client';

import { useState } from 'react';
import { TennisSession, SessionType, MatchResult } from '@/lib/types';
import { saveSession } from '@/lib/storage';

const COMMON_DRILLS = [
  'Serve practice',
  'Return drills',
  'Baseline rallying',
  'Net volleys',
  'Overhead smashes',
  'Footwork drills',
  'Approach shots',
  'Drop shots',
  'Conditioning',
];

interface Props {
  onSaved: () => void;
}

export default function SessionForm({ onSaved }: Props) {
  const [type, setType] = useState<SessionType>('practice');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [drills, setDrills] = useState<string[]>([]);
  const [opponent, setOpponent] = useState('');
  const [score, setScore] = useState('');
  const [result, setResult] = useState<MatchResult>('win');

  function toggleDrill(drill: string) {
    setDrills((prev) =>
      prev.includes(drill) ? prev.filter((d) => d !== drill) : [...prev, drill]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const session: TennisSession = {
      id: crypto.randomUUID(),
      type,
      date,
      durationMinutes: duration,
      notes,
      ...(type === 'practice' ? { drills } : { opponent, score, result }),
      createdAt: new Date().toISOString(),
    };

    saveSession(session);
    onSaved();

    // Reset
    setNotes('');
    setDrills([]);
    setOpponent('');
    setScore('');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Session Type Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-neutral-700">
        <button
          type="button"
          onClick={() => setType('practice')}
          className={`flex-1 py-2 text-sm font-medium transition ${
            type === 'practice'
              ? 'bg-green-600 text-white'
              : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          Practice
        </button>
        <button
          type="button"
          onClick={() => setType('match')}
          className={`flex-1 py-2 text-sm font-medium transition ${
            type === 'match'
              ? 'bg-green-600 text-white'
              : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          Match
        </button>
      </div>

      {/* Date & Duration */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">
            Duration (min)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min={1}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Practice: Drills */}
      {type === 'practice' && (
        <div>
          <label className="block text-xs text-neutral-400 mb-2">Drills</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_DRILLS.map((drill) => (
              <button
                key={drill}
                type="button"
                onClick={() => toggleDrill(drill)}
                className={`px-3 py-1 rounded-full text-xs transition ${
                  drills.includes(drill)
                    ? 'bg-green-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}
              >
                {drill}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Match: Opponent, Score, Result */}
      {type === 'match' && (
        <>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">
              Opponent
            </label>
            <input
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="Who did you play?"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                Score
              </label>
              <input
                type="text"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="6-4, 3-6, 7-5"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                Result
              </label>
              <div className="flex rounded-lg overflow-hidden border border-neutral-700">
                <button
                  type="button"
                  onClick={() => setResult('win')}
                  className={`flex-1 py-2 text-sm font-medium ${
                    result === 'win'
                      ? 'bg-green-600 text-white'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  Win
                </button>
                <button
                  type="button"
                  onClick={() => setResult('loss')}
                  className={`flex-1 py-2 text-sm font-medium ${
                    result === 'loss'
                      ? 'bg-red-600 text-white'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  Loss
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Notes */}
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it go? What felt good? What to work on?"
          rows={3}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition"
      >
        Log Session
      </button>
    </form>
  );
}
