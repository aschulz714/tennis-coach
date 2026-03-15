'use client';

import { useState, useEffect } from 'react';
import { TennisSession } from '@/lib/types';
import { getUtrPlayerId } from '@/lib/storage';

interface UtrProfile {
  singlesUtr: number;
  doublesUtr: number;
  firstName: string;
  lastName: string;
}

interface Props {
  sessions: TennisSession[];
}

export default function StatsView({ sessions }: Props) {
  const [utrProfile, setUtrProfile] = useState<UtrProfile | null>(null);

  useEffect(() => {
    const playerId = getUtrPlayerId();
    if (!playerId) return;

    fetch('/api/utr/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUtrProfile(data);
      })
      .catch(() => {});
  }, []);
  const matches = sessions.filter((s) => s.type === 'match');
  const practices = sessions.filter((s) => s.type === 'practice');

  // Win/loss overall
  const wins = matches.filter((s) => s.result === 'win').length;
  const losses = matches.filter((s) => s.result === 'loss').length;
  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

  // Win/loss by team
  function teamStats(team: string) {
    const teamMatches = matches.filter((s) => s.team === team);
    const w = teamMatches.filter((s) => s.result === 'win').length;
    const l = teamMatches.filter((s) => s.result === 'loss').length;
    return { wins: w, losses: l, total: teamMatches.length };
  }

  const vermaStats = teamStats('4.0 Verma');
  const dhindsaStats = teamStats('4.5 Dhindsa');
  const otherStats = teamStats('Other/Pickup');
  // Also count matches without team tag (legacy data)
  const untagged = matches.filter((s) => !s.team);

  // Win rate trend
  function winRateForSlice(n: number) {
    const slice = matches.slice(0, n);
    if (slice.length === 0) return null;
    const w = slice.filter((s) => s.result === 'win').length;
    return Math.round((w / slice.length) * 100);
  }

  const last5 = winRateForSlice(5);
  const last10 = winRateForSlice(10);
  const allTime = winRateForSlice(matches.length);

  // Most frequent opponents
  const opponentCounts: Record<string, number> = {};
  matches.forEach((s) => {
    const opp = s.opponent || 'Unknown';
    opponentCounts[opp] = (opponentCounts[opp] || 0) + 1;
  });
  const topOpponents = Object.entries(opponentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Practice frequency (sessions per week over last 8 weeks)
  const now = new Date();
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
  const recentSessions = sessions.filter(
    (s) => new Date(s.date) >= eightWeeksAgo
  );
  const weeksActive = Math.max(1, 8);
  const sessionsPerWeek = (recentSessions.length / weeksActive).toFixed(1);

  // Total hours
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Favorite drills
  const drillCounts: Record<string, number> = {};
  practices.forEach((s) => {
    s.drills?.forEach((d) => {
      drillCounts[d] = (drillCounts[d] || 0) + 1;
    });
  });
  const topDrills = Object.entries(drillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxDrillCount = topDrills.length > 0 ? topDrills[0][1] : 1;

  if (sessions.length === 0) {
    return (
      <div className="text-center text-neutral-500 py-12">
        <p className="text-lg">No stats yet</p>
        <p className="text-sm mt-1">Log some sessions to see your stats!</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* UTR Ratings */}
      {utrProfile && (utrProfile.singlesUtr > 0 || utrProfile.doublesUtr > 0) && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
          <h3 className="text-xs text-neutral-400 uppercase tracking-wide mb-3">
            UTR Rating
          </h3>
          <div className="flex items-center gap-6">
            {utrProfile.singlesUtr > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {utrProfile.singlesUtr.toFixed(2)}
                </div>
                <div className="text-xs text-neutral-500">Singles</div>
              </div>
            )}
            {utrProfile.doublesUtr > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {utrProfile.doublesUtr.toFixed(2)}
                </div>
                <div className="text-xs text-neutral-500">Doubles</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overall Record */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
        <h3 className="text-xs text-neutral-400 uppercase tracking-wide mb-3">
          Overall Record
        </h3>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-green-400">
            {wins}W-{losses}L
          </div>
          {matches.length > 0 && (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-neutral-400">{winRate}% win rate</span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* By Team */}
      {(vermaStats.total > 0 || dhindsaStats.total > 0) && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
          <h3 className="text-xs text-neutral-400 uppercase tracking-wide mb-3">
            By Team
          </h3>
          <div className="space-y-2">
            {vermaStats.total > 0 && (
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-300">
                  4.0 Verma
                </span>
                <span className="text-sm text-neutral-300">
                  {vermaStats.wins}W-{vermaStats.losses}L
                </span>
              </div>
            )}
            {dhindsaStats.total > 0 && (
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-900 text-purple-300">
                  4.5 Dhindsa
                </span>
                <span className="text-sm text-neutral-300">
                  {dhindsaStats.wins}W-{dhindsaStats.losses}L
                </span>
              </div>
            )}
            {otherStats.total > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Other/Pickup</span>
                <span className="text-sm text-neutral-300">
                  {otherStats.wins}W-{otherStats.losses}L
                </span>
              </div>
            )}
            {untagged.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Untagged</span>
                <span className="text-sm text-neutral-500">
                  {untagged.filter((s) => s.result === 'win').length}W-
                  {untagged.filter((s) => s.result === 'loss').length}L
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Win Rate Trend */}
      {matches.length >= 5 && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
          <h3 className="text-xs text-neutral-400 uppercase tracking-wide mb-3">
            Win Rate Trend
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            {last5 !== null && (
              <div>
                <div className="text-xl font-bold text-neutral-200">{last5}%</div>
                <div className="text-xs text-neutral-500">Last 5</div>
              </div>
            )}
            {last10 !== null && matches.length >= 10 && (
              <div>
                <div className="text-xl font-bold text-neutral-200">{last10}%</div>
                <div className="text-xs text-neutral-500">Last 10</div>
              </div>
            )}
            {allTime !== null && (
              <div>
                <div className="text-xl font-bold text-neutral-200">{allTime}%</div>
                <div className="text-xs text-neutral-500">All Time</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-neutral-200">{totalHours}</div>
          <div className="text-xs text-neutral-500">Total Hours</div>
        </div>
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-neutral-200">{sessionsPerWeek}</div>
          <div className="text-xs text-neutral-500">Sessions/Week (8wk)</div>
        </div>
      </div>

      {/* Top Opponents */}
      {topOpponents.length > 0 && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
          <h3 className="text-xs text-neutral-400 uppercase tracking-wide mb-3">
            Most Frequent Opponents
          </h3>
          <div className="space-y-2">
            {topOpponents.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm text-neutral-300 truncate mr-2">{name}</span>
                <span className="text-xs text-neutral-500">{count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Drills */}
      {topDrills.length > 0 && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
          <h3 className="text-xs text-neutral-400 uppercase tracking-wide mb-3">
            Favorite Drills
          </h3>
          <div className="space-y-2">
            {topDrills.map(([name, count]) => (
              <div key={name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-neutral-300">{name}</span>
                  <span className="text-xs text-neutral-500">{count}x</span>
                </div>
                <div className="w-full bg-neutral-700 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{
                      width: `${Math.round((count / maxDrillCount) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
