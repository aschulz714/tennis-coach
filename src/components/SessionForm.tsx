'use client';

import { useState } from 'react';
import {
  TennisSession,
  SessionType,
  MatchResult,
  SetScore,
  Surface,
  MatchFormat,
  Team,
} from '@/lib/types';
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

const SURFACES: Surface[] = ['Hard', 'Clay', 'Indoor', 'Grass'];
const TEAMS: Team[] = ['4.0 Verma', '4.5 Dhindsa', 'Other/Pickup'];

interface Props {
  onSaved: () => void;
}

export default function SessionForm({ onSaved }: Props) {
  const [type, setType] = useState<SessionType>('match');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [drills, setDrills] = useState<string[]>([]);
  const [opponent, setOpponent] = useState('');
  const [result, setResult] = useState<MatchResult>('win');

  // New match fields
  const [sets, setSets] = useState<SetScore[]>([
    { yours: 0, opponent: 0 },
    { yours: 0, opponent: 0 },
  ]);
  const [showSet3, setShowSet3] = useState(false);
  const [doublesPartner, setDoublesPartner] = useState('');
  const [surface, setSurface] = useState<Surface>('Hard');
  const [team, setTeam] = useState<Team>('4.0 Verma');
  const [matchFormat, setMatchFormat] = useState<MatchFormat>('Doubles');

  function toggleDrill(drill: string) {
    setDrills((prev) =>
      prev.includes(drill) ? prev.filter((d) => d !== drill) : [...prev, drill]
    );
  }

  function updateSet(index: number, field: 'yours' | 'opponent', value: number) {
    setSets((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function formatScoreString(): string {
    const activeSets = showSet3 ? sets.slice(0, 3) : sets.slice(0, 2);
    return activeSets
      .filter((s) => s.yours > 0 || s.opponent > 0)
      .map((s, i) => {
        if (i === 2) return `[${s.yours}-${s.opponent}]`;
        return `${s.yours}-${s.opponent}`;
      })
      .join(', ');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const activeSets = showSet3
      ? [...sets.slice(0, 2), sets[2] || { yours: 0, opponent: 0 }]
      : sets.slice(0, 2);

    const session: TennisSession = {
      id: crypto.randomUUID(),
      type,
      date,
      durationMinutes: duration,
      notes,
      ...(type === 'practice'
        ? { drills }
        : {
            opponent,
            score: formatScoreString(),
            result,
            sets: activeSets,
            doublesPartner: matchFormat === 'Doubles' ? doublesPartner : undefined,
            surface,
            team,
            matchFormat,
          }),
      createdAt: new Date().toISOString(),
    };

    saveSession(session);
    onSaved();

    // Reset
    setNotes('');
    setDrills([]);
    setOpponent('');
    setSets([
      { yours: 0, opponent: 0 },
      { yours: 0, opponent: 0 },
    ]);
    setShowSet3(false);
    setDoublesPartner('');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-2 text-sm"
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
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-2 text-sm"
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

      {/* Match Fields */}
      {type === 'match' && (
        <>
          {/* Match Format + Team */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Format</label>
              <div className="flex rounded-lg overflow-hidden border border-neutral-700">
                <button
                  type="button"
                  onClick={() => setMatchFormat('Doubles')}
                  className={`flex-1 py-1.5 text-xs font-medium ${
                    matchFormat === 'Doubles'
                      ? 'bg-green-600 text-white'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  Doubles
                </button>
                <button
                  type="button"
                  onClick={() => setMatchFormat('Singles')}
                  className={`flex-1 py-1.5 text-xs font-medium ${
                    matchFormat === 'Singles'
                      ? 'bg-green-600 text-white'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  Singles
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Team</label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value as Team)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-sm"
              >
                {TEAMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Surface */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Surface</label>
            <div className="grid grid-cols-4 gap-1.5">
              {SURFACES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSurface(s)}
                  className={`py-1.5 text-xs font-medium rounded-lg transition ${
                    surface === s
                      ? 'bg-green-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Opponent */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Opponent</label>
            <input
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="Who did you play?"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Doubles Partner */}
          {matchFormat === 'Doubles' && (
            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                Doubles Partner
              </label>
              <input
                type="text"
                value={doublesPartner}
                onChange={(e) => setDoublesPartner(e.target.value)}
                placeholder="Your partner's name"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          {/* Per-Set Scores */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-neutral-400">Score</label>
              <div className="flex gap-6 text-[10px] text-neutral-500 pr-1">
                <span>You</span>
                <span>Opp</span>
              </div>
            </div>
            <div className="space-y-2">
              {[0, 1].map((setIdx) => (
                <div key={setIdx} className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 w-8 shrink-0">
                    Set {setIdx + 1}
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={7}
                    value={sets[setIdx]?.yours ?? 0}
                    onChange={(e) =>
                      updateSet(setIdx, 'yours', Number(e.target.value))
                    }
                    className="w-12 shrink-0 bg-neutral-800 border border-neutral-700 rounded-lg px-1 py-1.5 text-sm text-center"
                  />
                  <span className="text-neutral-500 text-xs shrink-0">-</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={7}
                    value={sets[setIdx]?.opponent ?? 0}
                    onChange={(e) =>
                      updateSet(setIdx, 'opponent', Number(e.target.value))
                    }
                    className="w-12 shrink-0 bg-neutral-800 border border-neutral-700 rounded-lg px-1 py-1.5 text-sm text-center"
                  />
                </div>
              ))}

              {showSet3 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 w-8 shrink-0">TB</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={15}
                    value={sets[2]?.yours ?? 0}
                    onChange={(e) =>
                      updateSet(2, 'yours', Number(e.target.value))
                    }
                    className="w-12 shrink-0 bg-neutral-800 border border-neutral-700 rounded-lg px-1 py-1.5 text-sm text-center"
                  />
                  <span className="text-neutral-500 text-xs shrink-0">-</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={15}
                    value={sets[2]?.opponent ?? 0}
                    onChange={(e) =>
                      updateSet(2, 'opponent', Number(e.target.value))
                    }
                    className="w-12 shrink-0 bg-neutral-800 border border-neutral-700 rounded-lg px-1 py-1.5 text-sm text-center"
                  />
                  <span className="text-[10px] text-neutral-600 shrink-0">(to 10)</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!showSet3) {
                    setSets((prev) => [
                      ...prev.slice(0, 2),
                      { yours: 0, opponent: 0 },
                    ]);
                  }
                  setShowSet3(!showSet3);
                }}
                className="text-xs text-green-400 hover:text-green-300"
              >
                {showSet3 ? 'Remove Match Tiebreak' : '+ Match Tiebreak (1-1 split)'}
              </button>
            </div>
          </div>

          {/* Result */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Result</label>
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
